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
    
    const newRoom = {
      ...roomData,
      roomCode,
      createdAt: serverTimestamp(),
      status: 'active',
      participants: {},
      ownerId: roomData.userId
    }
    
    const docRef = await addDoc(roomsRef, newRoom)
    
    // 房主自動加入房間
    await joinRoom(docRef.id, roomData.userId)
    
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
    
    // 更新參與者列表
    await updateDoc(roomRef, {
      [`participants.${userId}`]: {
        joinedAt: serverTimestamp()
      }
    })
    
    return true
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

    // 如果不是房主，只從參與者列表中移除
    await updateDoc(roomRef, {
      [`participants.${userId}`]: deleteField()
    })
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