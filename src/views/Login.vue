<script setup>
import LogoHeader from '@/components/common/LogoHeader.vue';
import DIcon from '@/components/common/DIcon.vue';
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/auth/useAuth';
import { useToast } from '@/composables/useToast';
import { useRouter, useRoute } from 'vue-router';

// 初始化身份驗證
const auth = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// 頁面狀態管理
const activeTab = ref('login'); // 'login' 或 'register'
const isSubmitting = ref(false); // 提交狀態

// 表單驗證錯誤
const formErrors = ref({
  login: {
    email: '',
    password: ''
  },
  register: {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
});

// 表單數據
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false
});

const registerForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// 密碼強度
const passwordStrength = ref('medium'); // 'weak', 'medium', 'strong'

// 切換標籤頁
const switchTab = (tab) => {
  // 切換頁籤時重置錯誤訊息
  formErrors.value = {
    login: { email: '', password: '' },
    register: { name: '', email: '', password: '', confirmPassword: '' }
  };
  activeTab.value = tab;
};

// 驗證登入表單
const validateLoginForm = () => {
  let isValid = true;
  const errors = formErrors.value.login;

  // 重置錯誤訊息
  errors.email = '';
  errors.password = '';

  // 驗證電子郵件
  if (!loginForm.value.email) {
    errors.email = '請輸入電子郵件';
    isValid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(loginForm.value.email)) {
    errors.email = '請輸入有效的電子郵件格式';
    isValid = false;
  }

  // 驗證密碼
  if (!loginForm.value.password) {
    errors.password = '請輸入密碼';
    isValid = false;
  }

  return isValid;
};

// 驗證註冊表單
const validateRegisterForm = () => {
  let isValid = true;
  const errors = formErrors.value.register;

  // 重置錯誤訊息
  errors.name = '';
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';

  // 驗證姓名
  if (!registerForm.value.name) {
    errors.name = '請輸入姓名';
    isValid = false;
  }

  // 驗證電子郵件
  if (!registerForm.value.email) {
    errors.email = '請輸入電子郵件';
    isValid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(registerForm.value.email)) {
    errors.email = '請輸入有效的電子郵件格式';
    isValid = false;
  }

  // 驗證密碼
  if (!registerForm.value.password) {
    errors.password = '請輸入密碼';
    isValid = false;
  } else if (registerForm.value.password.length < 8) {
    errors.password = '密碼長度必須至少為8個字符';
    isValid = false;
  }

  // 驗證確認密碼
  if (!registerForm.value.confirmPassword) {
    errors.confirmPassword = '請再次輸入密碼';
    isValid = false;
  } else if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errors.confirmPassword = '兩次輸入的密碼不一致';
    isValid = false;
  }

  return isValid;
};

// 登入表單提交
const handleLogin = async (e) => {
  e.preventDefault();

  if (!validateLoginForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await auth.login(loginForm.value.email, loginForm.value.password);

    // 成功登入後重定向
    const redirectPath = route.query.redirect || '/';
    router.push(redirectPath);
  } catch (error) {
    // 錯誤處理已經在 useAuth 中完成
    console.error('登入失敗:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// 註冊表單提交
const handleRegister = async (e) => {
  e.preventDefault();

  if (!validateRegisterForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // 註冊用戶
    await auth.register(
      registerForm.value.email,
      registerForm.value.password,
      registerForm.value.name
    );

    // 自動登入
    try {
      await auth.login(
        registerForm.value.email,
        registerForm.value.password
      );

      // 成功登入後重定向到首頁
      const redirectPath = route.query.redirect || '/';
      router.push(redirectPath);
    } catch (loginError) {
      console.error('自動登入失敗:', loginError);
      // 自動登入失敗，切換到登入頁籤讓用戶手動登入
      switchTab('login');
      // 自動填寫登入表單的電子郵件
      loginForm.value.email = registerForm.value.email;
      toast.info('請使用剛註冊的帳號登入');
    }
  } catch (error) {
    // 錯誤處理已經在 useAuth 中完成
    console.error('註冊失敗:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// 社交媒體登入
const handleSocialLogin = (provider) => {
  toast.info(`${provider} 登入功能正在開發中`);
};

// 計算密碼強度
const calculatePasswordStrength = (password) => {
  if (!password) return 'weak';
  if (password.length < 8) return 'weak';

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

  if (strength < 2) return 'weak';
  if (strength < 4) return 'medium';
  return 'strong';
};

// 監聽密碼變更
const updatePasswordStrength = () => {
  passwordStrength.value = calculatePasswordStrength(registerForm.value.password);
};
</script>

<template>
  <div class="w-full min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
    <div class="w-full max-w-md">
      <!-- Logo 區域 -->
      <div class="text-center mb-8">
        <LogoHeader />
      </div>

      <!-- 卡片 -->
      <div class="rounded-xl shadow-xl p-8 mb-6 backdrop-blur-md bg-white/80">
        <!-- Tab 切換 -->
        <div class="flex border-b border-gray-200 mb-6 relative">
          <button @click="switchTab('login')" :class="`cursor-pointer flex-1 text-center py-3 font-medium ${activeTab === 'login' ? 'text-red-500' : 'text-gray-500'}`">
            登入
          </button>
          <button @click="switchTab('register')" :class="`cursor-pointer flex-1 text-center py-3 font-medium ${activeTab === 'register' ? 'text-red-500' : 'text-gray-500'}`">
            註冊
          </button>

          <!-- 動畫滑動指示器 -->
          <div class="tab-indicator" :class="activeTab === 'login' ? 'left-0' : 'left-1/2'"></div>
        </div>

        <!-- 表單容器 -->
        <div class="form-container relative overflow-hidden">
          <!-- 登入表單 -->
          <transition name="form-slide" mode="out-in">
            <form v-if="activeTab === 'login'" @submit="handleLogin" key="login" class="form-panel">
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                <input v-model="loginForm.email" type="email" id="email" autocomplete="username" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" :class="{ 'border-red-500': formErrors.login.email }" placeholder="請輸入您的電子郵件">
                <p v-if="formErrors.login.email" class="mt-1 text-sm text-red-600">{{ formErrors.login.email }}</p>
              </div>

              <div class="mb-4">
                <div class="flex items-center justify-between mb-1">
                  <label for="password" class="block text-sm font-medium text-gray-700">密碼</label>
                  <a href="#" class="text-xs text-indigo-600 hover:text-indigo-800">忘記密碼？</a>
                </div>
                <input v-model="loginForm.password" type="password" id="password" autocomplete="current-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" :class="{ 'border-red-500': formErrors.login.password }" placeholder="請輸入您的密碼">
                <p v-if="formErrors.login.password" class="mt-1 text-sm text-red-600">{{ formErrors.login.password }}</p>
              </div>

              <div class="mb-6">
                <label class="flex items-center">
                  <input v-model="loginForm.rememberMe" type="checkbox" class="rounded text-indigo-600 h-4 w-4">
                  <span class="ml-2 text-sm text-gray-600">記住我</span>
                </label>
              </div>

              <button type="submit" class="w-full text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:-translate-y-1 hover:shadow-lg" :disabled="isSubmitting">
                <span v-if="!isSubmitting">登入</span>
                <span v-else class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  處理中...
                </span>
              </button>
            </form>

            <!-- 註冊表單 -->
            <form v-else-if="activeTab === 'register'" @submit="handleRegister" key="register" class="form-panel">
              <div class="mb-4 form-field animate-field">
                <label for="register-name" class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input v-model="registerForm.name" type="text" id="register-name" autocomplete="name" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" :class="{ 'border-red-500': formErrors.register.name }" placeholder="請輸入您的姓名">
                <p v-if="formErrors.register.name" class="mt-1 text-sm text-red-600">{{ formErrors.register.name }}</p>
              </div>

              <div class="mb-4 form-field animate-field" style="animation-delay: 0.05s;">
                <label for="register-email" class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                <input v-model="registerForm.email" type="email" id="register-email" autocomplete="username" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" :class="{ 'border-red-500': formErrors.register.email }" placeholder="請輸入您的電子郵件">
                <p v-if="formErrors.register.email" class="mt-1 text-sm text-red-600">{{ formErrors.register.email }}</p>
              </div>

              <div class="mb-4 form-field animate-field" style="animation-delay: 0.1s;">
                <label for="register-password" class="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                <input v-model="registerForm.password" @input="updatePasswordStrength" type="password" id="register-password" autocomplete="new-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" :class="{ 'border-red-500': formErrors.register.password }" placeholder="請設定密碼">
                <p v-if="formErrors.register.password" class="mt-1 text-sm text-red-600">{{ formErrors.register.password }}</p>

                <!-- 密碼強度指示器 -->
                <div class="h-1 rounded-sm overflow-hidden mt-1">
                  <div :class="{
                    'h-full transition-all duration-300': true,
                    'bg-red-500 w-3/12': passwordStrength === 'weak',
                    'bg-yellow-500 w-6/12': passwordStrength === 'medium',
                    'bg-green-500 w-full': passwordStrength === 'strong'
                  }">
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  密碼強度：{{
                    passwordStrength === 'weak' ? '弱（建議加強）' :
                      passwordStrength === 'medium' ? '中等（建議包含大小寫字母、數字和符號）' :
                        '強'
                  }}
                </p>
              </div>

              <div class="mb-4 form-field animate-field" style="animation-delay: 0.15s;">
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
                <input v-model="registerForm.confirmPassword" type="password" id="confirm-password" autocomplete="new-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" :class="{ 'border-red-500': formErrors.register.confirmPassword }" placeholder="請再次輸入密碼">
                <p v-if="formErrors.register.confirmPassword" class="mt-1 text-sm text-red-600">{{ formErrors.register.confirmPassword }}</p>
              </div>

              <button type="submit" class="w-full text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:-translate-y-1 hover:shadow-lg form-field animate-field" style="animation-delay: 0.25s;" :disabled="isSubmitting">
                <span v-if="!isSubmitting">註冊帳號</span>
                <span v-else class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  處理中...
                </span>
              </button>
            </form>
          </transition>
        </div>

        <!-- 分隔線 -->
        <!-- <div class="flex items-center my-6">
          <div class="flex-grow border-t border-gray-300"></div>
          <span class="px-3 text-gray-500 text-sm">或使用</span>
          <div class="flex-grow border-t border-gray-300"></div>
        </div> -->

        <!-- 社交媒體登入 -->
        <!-- <div class="grid grid-cols-2 gap-4">
          <button @click="handleSocialLogin('Google')" type="button" class="flex items-center justify-center py-2.5 px-4 rounded-lg border border-gray-300 bg-white hover:shadow-md hover:-translate-y-1 transition-all social-button">
            <DIcon type="google" size="5" class="mr-2" />
            <span class="text-gray-700 font-medium">Google</span>
          </button>
          <button @click="handleSocialLogin('Facebook')" type="button" class="flex items-center justify-center py-2.5 px-4 rounded-lg border border-gray-300 bg-white hover:shadow-md hover:-translate-y-1 transition-all social-button">
            <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span class="text-gray-700 font-medium">Facebook</span>
          </button>
        </div> -->
      </div>

      <!-- 底部連結 -->
      <div class="text-center text-sm text-gray-600">
        <transition name="fade" mode="out-in">
          <template v-if="activeTab === 'login'">
            <div>還沒有帳號？<a @click="switchTab('register')" href="javascript:void(0)" class="text-indigo-600 font-medium hover:text-indigo-800">立即註冊</a></div>
          </template>
          <template v-else>
            <div>已有帳號？<a @click="switchTab('login')" href="javascript:void(0)" class="text-indigo-600 font-medium hover:text-indigo-800">立即登入</a></div>
          </template>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 漸變按鈕效果 */
button[type="submit"] {
  background: linear-gradient(to right, #FF8A80, #FF5252);
  transition: all 0.3s ease;
}

button[type="submit"]:hover:not(:disabled) {
  background: linear-gradient(to right, #FF5252, #FF1744);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

button[type="submit"]:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 漸變背景 */
.logo-text {
  background: linear-gradient(to right, #5E5CE6, #00B8D9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 表單輸入框焦點效果 */
input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus {
  border-color: #5E5CE6;
  box-shadow: 0 0 0 2px rgba(94, 92, 230, 0.2);
}

/* 標籤切換動畫 */
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  width: 50%;
  background-color: #FF5252;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 表單切換動畫 */
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.1s ease;
}

.form-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.form-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 社交按鈕動畫 */
.social-button {
  transition: all 0.3s ease;
}

.social-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 底部連結淡入淡出動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 表單字段逐個顯示動畫 */
@keyframes fieldAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-field {
  animation-name: fieldAppear;
  animation-duration: 0.4s;
  animation-fill-mode: both;
  animation-timing-function: ease-out;
}

/* 表單容器高度動畫 */
.form-container {
  min-height: 250px;
  transition: min-height 0.3s ease;
}

.form-container:has(form[key="register"]) {
  min-height: 450px;
}
</style>
