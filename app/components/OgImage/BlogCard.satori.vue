<template>
  <div
    :style="{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#09090b',
      padding: '60px 80px',
    }"
  >
    <div :style="{ display: 'flex', flexDirection: 'column', gap: '16px' }">
      <span :style="{ color: '#71717a', fontSize: '28px' }">blog.naokihaba.com</span>
      <span :style="{ color: '#fafafa', fontSize: '56px', fontWeight: 700 }">naokihaba blog</span>
    </div>
    <div
      :style="{
        width: '120px',
        height: '120px',
        borderRadius: '16px',
        backgroundColor: '#18181b',
        border: '1px solid #3f3f46',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <span :style="{ color: '#fafafa', fontSize: '56px', fontWeight: 700 }">N</span>
    </div>
  </div>
</template>
