import { defineStore } from 'pinia'

// 定義一個 store
export const useExampleStore = defineStore('example', {
  // 狀態（類似於 data）
  state: () => ({
    counter: 0,
    name: 'DineVote'
  }),

  // 獲取器（類似於 computed）
  getters: {
    doubleCount: (state) => state.counter * 2
  },

  // 動作（類似於 methods，可以是異步的）
  actions: {
    increment() {
      this.counter++
    },
    async fetchSomething() {
      // 可以在這裡進行 API 調用
      // const data = await api.get('...')
      // this.someState = data
    }
  }
}) 