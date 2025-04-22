import { ref, computed } from 'vue';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/composables/useToast';

export function useAuth() {
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const toast = useToast();
  
  // 是否已登入
  const isAuthenticated = computed(() => !!user.value);
  
  // 監聽身份驗證狀態變化
  const initialize = () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      loading.value = false;
      if (currentUser) {
        user.value = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || ''
        };
      } else {
        user.value = null;
      }
    }, (err) => {
      loading.value = false;
      error.value = err.message;
      toast.error(`驗證狀態監聽錯誤: ${err.message}`);
    });
    
    // 返回取消訂閱函數，用於組件卸載時清理
    return unsubscribe;
  };
  
  // 處理身份驗證錯誤
  const handleAuthError = (error) => {
    loading.value = false;
    console.log('error', error.code);
    
    // 對應不同錯誤碼提供友好的錯誤信息
    const errorMessages = {
      'auth/email-already-in-use': '此電子郵件已被使用',
      'auth/invalid-email': '無效的電子郵件格式',
      'auth/user-disabled': '此用戶帳號已被停用',
      'auth/user-not-found': '找不到此用戶',
      'auth/wrong-password': '密碼錯誤',
      'auth/too-many-requests': '登入嘗試次數過多，請稍後再試',
      'auth/weak-password': '密碼強度不足',
      'auth/operation-not-allowed': '此登入方式未啟用',
      'auth/network-request-failed': '網絡連接失敗，請檢查網絡設置',
      'auth/app-deleted': 'Firebase應用已刪除',
      'auth/app-not-authorized': 'Firebase應用未授權',
      'auth/argument-error': '請求參數無效',
      'auth/invalid-api-key': 'Firebase API密鑰無效',
      'auth/invalid-user-token': '用戶令牌已過期，請重新登入',
      'auth/invalid-tenant-id': '租戶ID無效',
      'auth/requires-recent-login': '請重新登入以進行此操作',
      'auth/unauthorized-domain': '當前網域未獲授權',
      'auth/web-storage-unsupported': '當前瀏覽器不支持Web存儲',
      'auth/quota-exceeded': '配額超出限制',
      'auth/invalid-credential': '找不到帳號或密碼'
    };
    
    // 檢查是否為特殊錯誤情況：API方法被阻擋
    if (error.code === 'auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.authenticationservice.signup-are-blocked.') {
      const message = 'Firebase配置錯誤：身份驗證服務未正確設置或API密鑰權限不足。請聯繫管理員。';
      error.value = message;
      toast.error(message);
      console.error('Firebase配置問題:', error);
      return message;
    }
    
    const errorMessage = errorMessages[error.code] || error.message;
    error.value = errorMessage;
    toast.error(errorMessage);
    return errorMessage;
  };
  
  // 註冊新用戶
  const register = async (email, password, displayName) => {
    error.value = null;
    loading.value = true;
    
    try {
      console.log(`email: ${email}, password: ${password}, displayName: ${displayName}`);
      // 創建用戶
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 更新用戶資料（顯示名稱）
      await updateProfile(userCredential.user, { displayName });
      
      // 更新本地用戶資料
      user.value = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName,
        photoURL: userCredential.user.photoURL
      };
      
      toast.success('註冊成功！');
      return userCredential.user;
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // 電子郵件和密碼登入
  const login = async (email, password) => {
    error.value = null;
    loading.value = true;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user.value = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || ''
      };
      
      toast.success('登入成功！');
      return userCredential.user;
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // 登出
  const logout = async () => {
    error.value = null;
    loading.value = true;
    
    try {
      await signOut(auth);
      user.value = null;
      return true;
    } catch (err) {
      handleAuthError(err);
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    register,
    login,
    logout
  };
} 