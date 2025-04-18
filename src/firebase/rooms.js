import { db } from './index'
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteField,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'

// 生成6碼房間代碼
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 檢查房間代碼是否已存在
const isRoomCodeExists = async (code) => {
  const roomsRef = collection(db, 'rooms')
  const q = query(roomsRef, where('roomCode', '==', code))
  const querySnapshot = await getDocs(q)
  return !querySnapshot.empty
}

// 生成唯一的房間代碼
const generateUniqueRoomCode = async () => {
  let code
  let exists = true
  while (exists) {
    code = generateRoomCode()
    exists = await isRoomCodeExists(code)
  }
  return code
}

// 創建新房間
export const createRoom = async (roomData) => {
  try {
    const roomsRef = collection(db, 'rooms')
    const roomCode = await generateUniqueRoomCode()
    
    if (!roomData.userId) {
      throw new Error('缺少使用者ID')
    }

    // 生成參與者 ID
    const participantId = crypto.randomUUID()
    
    const newRoom = {
      ...roomData,
      roomCode,
      createdAt: serverTimestamp(),
      status: 'active',
      participants: {
        [participantId]: {
          userId: roomData.userId,
          joinedAt: serverTimestamp(),
          isOwner: true,
          voteStatus: 'pending'
        }
      },
      ownerId: roomData.userId
    }
    
    const docRef = await addDoc(roomsRef, newRoom)
    return { id: docRef.id, ...newRoom }
  } catch (error) {
    console.error('創建房間失敗:', error)
    throw error
  }
}

// 獲取活躍房間列表
export const getActiveRooms = async () => {
  try {
    const roomsRef = collection(db, 'rooms')
    const q = query(
      roomsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('獲取房間列表失敗:', error)
    throw error
  }
}

// 獲取單一房間資訊
export const getRoomById = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomDoc = await getDoc(roomRef)
    
    if (!roomDoc.exists()) {
      return null
    }
    
    return {
      id: roomDoc.id,
      ...roomDoc.data()
    }
  } catch (error) {
    console.error('獲取房間資訊失敗:', error)
    throw error
  }
}

// 根據房間代碼查詢房間
export const getRoomByCode = async (roomCode) => {
  try {
    const roomsRef = collection(db, 'rooms')
    const q = query(roomsRef, where('roomCode', '==', roomCode), limit(1))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const roomDoc = querySnapshot.docs[0]
    return {
      id: roomDoc.id,
      ...roomDoc.data()
    }
  } catch (err) {
    console.error('查詢房間失敗:', err)
    throw new Error('查詢房間失敗')
  }
}

// 加入房間
export const joinRoom = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomDoc = await getDoc(roomRef)
    
    if (!roomDoc.exists()) {
      throw new Error('找不到此房間')
    }
    
    const roomData = roomDoc.data()
    if (roomData.status !== 'active') {
      throw new Error('此房間已結束')
    }

    // 生成參與者 ID
    const participantId = crypto.randomUUID()
    
    // 更新參與者列表
    await updateDoc(roomRef, {
      [`participants.${participantId}`]: {
        userId,
        joinedAt: serverTimestamp(),
        isOwner: false,
        voteStatus: 'pending'
      }
    })
    
    return { participantId }
  } catch (error) {
    console.error('加入房間失敗:', error)
    throw error
  }
}

// 離開房間
export const leaveRoom = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomDoc = await getDoc(roomRef)

    if (!roomDoc.exists()) {
      throw new Error('房間不存在')
    }

    const roomData = roomDoc.data()
    if (!roomData.status) {
      throw new Error('房間已結束')
    }

    // 如果是房主離開，刪除整個房間
    if (roomData.ownerId === userId) {
      console.log('房主離開，刪除房間')
      await deleteDoc(roomRef)
      return { isOwner: true }
    }

    // 如果不是房主，找到並移除該使用者的所有參與者記錄
    const participants = roomData.participants || {}
    const participantIds = Object.entries(participants)
      .filter(([_, participant]) => participant.userId === userId)
      .map(([participantId]) => participantId)

    // 刪除所有符合的參與者
    const updates = {}
    participantIds.forEach(pid => {
      updates[`participants.${pid}`] = deleteField()
    })

    if (Object.keys(updates).length > 0) {
      await updateDoc(roomRef, updates)
    }

    return { isOwner: false }
  } catch (err) {
    console.error('離開房間失敗:', err)
    throw err
  }
}

// 監聽房間狀態
export const watchRoom = (roomId, onUpdate) => {
  const roomRef = doc(db, 'rooms', roomId)
  return onSnapshot(roomRef, (doc) => {
    if (!doc.exists()) {
      onUpdate(null)
      return
    }
    onUpdate({
      id: doc.id,
      ...doc.data()
    })
  }, (error) => {
    console.error('監聽房間失敗:', error)
  })
}

// 提交投票
export const submitVote = async (roomId, participantId, voteData) => {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomDoc = await getDoc(roomRef)
    
    if (!roomDoc.exists()) {
      throw new Error('房間不存在')
    }
    
    const roomData = roomDoc.data()
    if (roomData.status !== 'active') {
      throw new Error('房間已結束，無法投票')
    }
    
    // 檢查參與者是否存在
    if (!roomData.participants || !roomData.participants[participantId]) {
      throw new Error('參與者不存在於此房間')
    }
    
    // 更新參與者的投票資料
    await updateDoc(roomRef, {
      [`participants.${participantId}.voteData`]: voteData,
      [`participants.${participantId}.votedAt`]: serverTimestamp(),
      [`participants.${participantId}.voteStatus`]: 'completed'
    })
    
    return true
  } catch (error) {
    console.error('提交投票失敗:', error)
    throw error
  }
}

// 獲取房間所有投票資料
export const getRoomVotes = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomDoc = await getDoc(roomRef)
    
    if (!roomDoc.exists()) {
      throw new Error('房間不存在')
    }
    
    const roomData = roomDoc.data()
    if (!roomData.participants) {
      return []
    }
    
    // 整理投票資料
    const votes = Object.entries(roomData.participants).map(([pid, participant]) => {
      return {
        participantId: pid,
        userId: participant.userId,
        voteData: participant.voteData || null,
        votedAt: participant.votedAt || null,
        voteStatus: participant.voteStatus || 'pending',
        isOwner: participant.isOwner || false
      }
    })
    
    return votes
  } catch (error) {
    console.error('獲取投票資料失敗:', error)
    throw error
  }
}

// 檢查房間投票狀態
export const checkRoomVoteStatus = async (roomId) => {
  try {
    const votes = await getRoomVotes(roomId)
    
    const totalParticipants = votes.length
    const votedParticipants = votes.filter(v => v.voteStatus === 'completed').length
    
    return {
      totalParticipants,
      votedParticipants,
      allVoted: totalParticipants > 0 && totalParticipants === votedParticipants,
      progress: totalParticipants > 0 ? (votedParticipants / totalParticipants) * 100 : 0
    }
  } catch (error) {
    console.error('檢查投票狀態失敗:', error)
    throw error
  }
}

// 實時監聽房間投票狀態
export const watchRoomVotes = (roomId, onUpdate) => {
  const roomRef = doc(db, 'rooms', roomId)
  
  return onSnapshot(roomRef, (doc) => {
    if (!doc.exists()) {
      onUpdate({ error: '房間不存在' })
      return
    }
    
    const roomData = doc.data()
    const participants = roomData.participants || {}
    
    // 整理投票資料
    const votes = Object.entries(participants).map(([pid, participant]) => {
      return {
        participantId: pid,
        userId: participant.userId,
        voteData: participant.voteData || null,
        votedAt: participant.votedAt || null,
        voteStatus: participant.voteStatus || 'pending',
        isOwner: participant.isOwner || false
      }
    })
    
    const totalParticipants = votes.length
    const votedParticipants = votes.filter(v => v.voteStatus === 'completed').length
    
    onUpdate({
      votes,
      totalParticipants,
      votedParticipants,
      allVoted: totalParticipants > 0 && totalParticipants === votedParticipants,
      progress: totalParticipants > 0 ? (votedParticipants / totalParticipants) * 100 : 0
    })
  }, (error) => {
    console.error('監聽投票狀態失敗:', error)
    onUpdate({ error: error.message })
  })
} 