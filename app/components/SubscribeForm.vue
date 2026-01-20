<script setup lang="ts">
const email = ref('');
const isSubmitting = ref(false);
const isSubscribed = ref(false);
const errorMessage = ref('');
const turnstileToken = ref('');

async function handleSubscribe() {
  if (!email.value) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    await $fetch('/api/subscribe', {
      method: 'POST',
      body: { email: email.value, turnstileToken: turnstileToken.value },
    });

    if (typeof (window as any).datafast === 'function') {
      (window as any).datafast("subscribe", {
        email: email.value,
      });
    }

    isSubscribed.value = true;
    email.value = '';
  } catch (error: any) {
    errorMessage.value = error.data?.message || 'Failed to subscribe. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <div v-if="!isSubscribed" class="space-y-4">
      <p class="text-neutral text-lg text-center text-md">
        Get early access:
      </p>

      <form class="flex gap-2" @submit.prevent="handleSubscribe">
        <input
          v-model="email"
          type="email"
          placeholder="founder@company.com"
          required
          class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors text-black"
          :disabled="isSubmitting"
        >
        <button
          type="submit"
          :disabled="isSubmitting || !email || !turnstileToken"
          class="px-6 py-3 bg-secondary text-white font-medium rounded-lg hover:bg-info focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <span v-if="!isSubmitting">Claim Your Spot</span>
          <span v-else class="flex items-center gap-2">
            <svg
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Subscribing...
          </span>
        </button>
      </form>

      <NuxtTurnstile v-model="turnstileToken" />

      <p v-if="errorMessage" class="text-red-500 text-sm text-center">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Success Message -->
    <div v-else class="text-center space-y-2">
      <div class="flex items-center justify-center">
        <svg
          class="w-8 h-8 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">
        You're all set!
      </h3>
      <p class="text-gray-600 text-sm">
        We'll notify you as soon as we launch. Thank you for your interest!
      </p>
    </div>
  </div>
</template>
