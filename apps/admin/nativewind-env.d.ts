/// <reference types="nativewind/types" />

// Metro handles the actual `.css` transform; tsc just needs to know the
// side-effect import (`import "../global.css"`) is a valid module.
declare module "*.css";
