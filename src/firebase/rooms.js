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
    
    if (!roomData.userUid) {
      throw new Error('缺少使用者UID')
    }

    const newRoom = {
      ...roomData,
      roomCode,
      createdAt: serverTimestamp(),
      status: 'active',
      participants: {
        [roomData.userUid]: {
          displayName: roomData.displayName || '',
          joinedAt: serverTimestamp(),
          isOwner: true,
          voteStatus: 'pending'
        }
      },
      ownerId: roomData.userUid
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
export const joinRoom = async (roomId, userUid, displayName) => {
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

    // 檢查使用者是否已在房間中
    const participants = roomData.participants || {}
    
    // 如果已存在此使用者，直接返回
    if (participants[userUid]) {
      return { isExisting: true }
    }

    // 更新參與者列表
    const updates = {}
    updates[`participants.${userUid}`] = {
      displayName: displayName || '',
      joinedAt: serverTimestamp(),
      isOwner: roomData.ownerId === userUid,
      voteStatus: 'pending'
    }
    
    await updateDoc(roomRef, updates)
    
    return { isExisting: false }
  } catch (error) {
    console.error('加入房間失敗:', error)
    throw error
  }
}

// 離開房間
export const leaveRoom = async (roomId, userUid) => {
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
    if (roomData.ownerId === userUid) {
      console.log('房主離開，刪除房間')
      await deleteDoc(roomRef)
      return { isOwner: true }
    }

    // 如果不是房主，移除該使用者的參與者記錄
    const participants = roomData.participants || {}
    
    // 檢查使用者是否在房間中
    if (participants[userUid]) {
      const updates = {}
      updates[`participants.${userUid}`] = deleteField()
      await updateDoc(roomRef, updates)
    }
    
    return { isOwner: false }
  } catch (error) {
    console.error('離開房間失敗:', error)
    throw error
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
export const submitVote = async (roomId, userUid, voteData) => {
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
    if (!roomData.participants || !roomData.participants[userUid]) {
      throw new Error('參與者不存在於此房間')
    }
    
    // 更新參與者的投票資料
    await updateDoc(roomRef, {
      [`participants.${userUid}.voteData`]: voteData,
      [`participants.${userUid}.votedAt`]: serverTimestamp(),
      [`participants.${userUid}.voteStatus`]: 'completed'
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
      return { votes: [], addressData: {} }
    }
    
    // 整理投票資料
    const votes = Object.entries(roomData.participants).map(([userUid, participant]) => {
      return {
        userUid: userUid,
        displayName: participant.displayName || '',
        voteData: participant.voteData || null,
        votedAt: participant.votedAt || null,
        voteStatus: participant.voteStatus || 'pending',
        isOwner: participant.isOwner || false
      }
    })
    
    // 地址資料
    const addressData = roomData.location || {}

    return { votes, addressData }
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
    const votes = Object.entries(participants).map(([userUid, participant]) => {
      return {
        userUid: userUid,
        displayName: participant.displayName || '',
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

// 獲取餐廳推薦結果
export const getRecommendationResults = async (roomId) => {
  try {
    if (!roomId) {
      throw new Error('缺少房間ID')
    }
    
    const roomRef = doc(db, 'rooms', roomId)
    const roomDoc = await getDoc(roomRef)
    
    if (!roomDoc.exists()) {
      throw new Error('房間不存在')
    }
    
    const roomData = roomDoc.data()
    
    // 返回推薦結果，如果不存在則返回null
    return roomData.recommendations || null
  } catch (error) {
    console.error('獲取推薦結果失敗:', error)
    throw error
  }
}

/**
 * 更新房間投票狀態
 * @param {string} roomId - 房間ID
 * @param {string} status - 狀態 ('waiting', 'active', 'completed')
 * @returns {Promise<boolean>} 更新結果
 */
export const updateRoomVotingStatus = async (roomId, status) => {
  try {
    if (!roomId) {
      throw new Error('未提供房間ID')
    }
    
    if (!['waiting', 'active', 'completed'].includes(status)) {
      throw new Error('無效的投票狀態')
    }
    
    const roomRef = doc(db, 'rooms', roomId)
    await updateDoc(roomRef, {
      votingStatus: status,
      votingUpdatedAt: serverTimestamp()
    })
    
    console.log(`已更新房間 ${roomId} 投票狀態為: ${status}`)
    return true
  } catch (error) {
    console.error('更新投票狀態失敗:', error)
    throw error
  }
} 