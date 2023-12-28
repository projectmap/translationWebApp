<template>
  <div class="processing">
    <div class="loader"></div>
    <h6>{{ message }}</h6>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: 'Processing, Please wait' },
});
</script>

<style scoped>
.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.loader {
  width: 60px; /* control the size */
  border-radius: 10%;
  aspect-ratio: 1;
  display: grid;
  -webkit-mask: conic-gradient(from 22deg, #0003, #000);
  mask: conic-gradient(from 22deg, #0003, #000);
  animation: load 1s steps(8) infinite;
}
.loader,
.loader:before {
  --_g: linear-gradient(#0d6d91 0 0) 50%; /* update the color here */
  background: var(--_g) / 34% 8% space no-repeat,
    var(--_g) / 8% 34% no-repeat space;
}
.loader:before {
  content: '';
  transform: rotate(45deg);
}
@keyframes load {
  from {
    transform: rotate(0turn);
  }
  to {
    transform: rotate(1turn);
  }
}

h6 {
  margin-top: 40px;
  font-weight: 600;
  font-size: 22px;
  line-height: 140%;
  margin-bottom: 0px;
}
</style>
