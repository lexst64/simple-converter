<template>
  <div class="flex flex-col items-center gap-[50px]">
    <h1 class="text-4xl font-bold tracking-tight text-slate-900">Image, Audio & Video Converter</h1>
    <section aria-label="File Uploader">
      <div
        class="flex min-h-[30vh] w-[92vw] flex-col items-center justify-center gap-[10px] rounded-[20px] border-2 border-dashed border-[#bfdaf4] bg-[#f6fafe] md:min-w-[50vw] md:w-auto"
      >
        <button
          class="rounded-lg bg-indigo-500 px-[1.2rem] py-[0.6rem] text-base text-white hover:cursor-pointer"
        >
          Select files
        </button>
        <span class="hidden md:block">or drag-and-drop here (up to 1.0 GB)</span>
      </div>
    </section>
  </div>
</template>
