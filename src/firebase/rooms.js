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
  arrayUnion
} from 'firebase/firestore'

// 創建新房間
export const createRoom = async (roomData) => {
  try {
    const roomsRef = collection(db, 'rooms')
    const newRoom = {
      ...roomData,
      createdAt: serverTimestamp(),
      status: 'active',
      participants: {}
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