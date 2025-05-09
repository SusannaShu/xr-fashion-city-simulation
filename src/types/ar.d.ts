declare global {
  interface Window {
    THREEx: any; // We use any here since AR.js doesn't provide TypeScript types
    AFRAME: {
      components: {
        [key: string]: any;
      };
      registerComponent: (name: string, component: any) => void;
      // Add other A-Frame properties as needed
    };
  }

  // Extend CustomElementRegistry to include internal delete method
  interface CustomElementRegistry {
    delete?(name: string): void;
  }
}

export {};
