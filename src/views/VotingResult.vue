<template>
  <div class="flex flex-col items-center">
    <div class="w-full max-w-md bg-gray-50 rounded-lg p-6 shadow-lg mt-4">
      <div class="flex flex-col items-center gap-2">
        <h1 class="text-xl font-bold">決定了！</h1>
        <p class="text-sm text-gray-600">根據大家的投票結果，推薦以下餐廳</p>
      </div>
      <div class="mt-4 shadow-lg rounded-lg">
        <div class="h-[200px] w-full bg-gray-200 rounded-t-lg"></div>
        <div class="p-4">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold">某某牛排館</span>
            <span class="flex items-center gap-1 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span class="text-sm text-gray-600">5</span>
            </span>
          </div>
          <div class="flex items-center text-sm text-gray-600 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            台北市中山區忠孝東路一段
          </div>
          <div class="flex items-center text-sm text-gray-600 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            步行約7分鐘（距離500公尺）
          </div>
          <div class="flex items-center text-sm text-gray-600 mt-2 gap-2">
            <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">西式料理</span>
            <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">牛排</span>
            <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">$$$</span>
          </div>
          <div class="text-gray-600 mt-3">
            <p class="text-sm font-bold">AI推薦原因</p>
            <p class="text-sm mt-2">根據大家的投票結果，多數成員都認為這間餐廳好吃，所以推薦給你</p>
          </div>
          <button class="w-full bg-red-gradient text-white px-4 py-2 rounded-lg mt-4 cursor-pointer">複製地圖分享連結</button>
        </div>
      </div>
      <div class="flex flex-col items-center mt-6">
        <p class="text-sm font-bold text-gray-700">滿意這個結果嗎?</p>
        <div class="flex items-center gap-2 mt-2">
          <button class="bg-red-gradient text-white px-4 py-2 rounded-lg cursor-pointer">滿意</button>
          <button class="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-pointer font-medium">重新投票</button>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <button class="text-blue-500 font-bold cursor-pointer">返回首頁</button>
    </div>
  </div>
</template>