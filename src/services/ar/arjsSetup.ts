// Don't import AFRAME - it's already loaded from CDN
declare global {
  interface Window {
    AFRAME: any;
    THREEx: any;
  }
}

export const initARjs = async (): Promise<void> => {
  try {
    // Wait for AFRAME to be fully initialized
    await new Promise<void>((resolve, reject) => {
      if (window.AFRAME && window.AFRAME.components) {
        resolve();
        return;
      }

      const maxAttempts = 50;
      let attempts = 0;

      const checkInit = () => {
        if (window.AFRAME && window.AFRAME.components) {
          // Only register components if they don't exist
          if (!window.AFRAME.components['gps-projected-camera']) {
            window.AFRAME.registerComponent('gps-projected-camera', {
              init: function () {
                // Initialize GPS camera
                this.el.setAttribute('position', '0 1.6 0');
                this.el.setAttribute('look-controls', '');

                // Request location permissions
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    position => {
                      console.log(
                        'GPS Camera initialized at:',
                        position.coords
                      );
                      // Emit an event that can be listened to by other components
                      this.el.emit('gps-camera-ready', {
                        position: position.coords,
                      });
                    },
                    error => {
                      console.error('Error getting location:', error);
                      this.el.emit('gps-camera-error', { error });
                    },
                    {
                      enableHighAccuracy: true,
                      maximumAge: 0,
                      timeout: 27000,
                    }
                  );
                }
              },
            });
          }

          if (!window.AFRAME.components['gps-projected-entity-place']) {
            window.AFRAME.registerComponent('gps-projected-entity-place', {
              schema: {
                latitude: { type: 'number', default: 0 },
                longitude: { type: 'number', default: 0 },
              },
              init: function () {
                this.camera = document.querySelector('[gps-projected-camera]');
                if (!this.camera) {
                  console.warn('GPS Camera not found, waiting...');
                  this.waitForCamera();
                  return;
                }
                this.updatePosition();
              },
              waitForCamera: function () {
                const scene = document.querySelector('a-scene');
                scene?.addEventListener('loaded', () => {
                  this.camera = document.querySelector(
                    '[gps-projected-camera]'
                  );
                  if (this.camera) {
                    this.updatePosition();
                  }
                });
              },
              updatePosition: function () {
                const position = this.el.getAttribute('position');
                if (position) {
                  this.el.setAttribute('position', position);
                }
              },
            });
          }

          console.log('AR components registered successfully');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(
            new Error(
              'Failed to initialize AR.js: AFRAME not found after 5 seconds'
            )
          );
        } else {
          attempts++;
          setTimeout(checkInit, 100);
        }
      };

      // Start checking
      checkInit();
    });
  } catch (error) {
    console.error('Failed to initialize AR.js:', error);
    throw error;
  }
};
