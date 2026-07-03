<!--
    BasePageContainer – Provides consistent horizontal padding and max-width
    for page content. Use this directly when you need spacing but NOT the
    standard title/description/breadcrumb header (e.g. the landing page).
-->
<template>
    <div class="py-4 px-4">
        <div class="mx-auto" style="max-width: 80rem">
            <slot />
        </div>
    </div>
</template>
