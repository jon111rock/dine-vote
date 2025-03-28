export function useLocalStorage() {
  const setItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('localStorage 儲存失敗:', error)
      return false
    }
  }

  const getItem = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('localStorage 讀取失敗:', error)
      return defaultValue
    }
  }

  const removeItem = (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('localStorage 刪除失敗:', error)
      return false
    }
  }

  return {
    setItem,
    getItem,
    removeItem
  }
} 