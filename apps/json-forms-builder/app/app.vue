<template>
    <div>
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage :key="$route.fullPath" />
        </NuxtLayout>
        <ToastContainer />
    </div>
</template>
