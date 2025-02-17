/// <reference types="aframe" />

declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': any;
    'a-entity': any;
    'a-camera': any;
    'a-box': any;
    'a-sphere': any;
    'a-cylinder': any;
    'a-plane': any;
    'a-sky': any;
    'a-assets': any;
    'a-asset-item': any;
  }
}

declare module 'aframe' {
  interface Entity {
    object3D: THREE.Object3D;
    components: {
      'gps-camera': {
        latitude: number;
        longitude: number;
      };
      [key: string]: any;
    };
    setObject3D(name: string, obj: THREE.Object3D): void;
    removeObject3D(name: string): void;
  }

  export interface Scene extends HTMLElement {
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}
