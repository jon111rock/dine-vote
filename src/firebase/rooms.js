import { db } from './index'
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
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