import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, Camera, CameraOff } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export function QRScanner({ isOpen, onClose, onScanSuccess, onScanError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const scannerId = 'qr-scanner';

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser');
      }

      // Request camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately to test permission
        setCameraPermission('granted');
      } catch (permError: any) {
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
        }
        throw permError;
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length === 0) {
        throw new Error('No cameras found on this device');
      }

      // Use the first available camera (usually the back camera on mobile)
      const cameraId = devices[0].id;

      // Start scanning with configuration
      // The library supports QR codes and all common barcode formats by default
      // Including: QR_CODE, CODE_128, CODE_39, CODE_93, EAN_13, EAN_8, UPC_A, UPC_E, ITF, CODABAR, DATA_MATRIX, AZTEC
      await html5QrCode.start(
        cameraId,
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning area
          aspectRatio: 1.0,
          // Don't specify formatsToSupport - let library use all supported formats by default
          // This ensures maximum compatibility with all barcode types
        },
        (decodedText) => {
          // Success callback
          onScanSuccess(decodedText);
          stopScanning();
          onClose();
        },
        (errorMessage) => {
          // Error callback - ignore continuous scanning errors
          // These are normal when scanning (library tries to read codes continuously)
          // Only log to console for debugging, don't show to user
          // The library will keep trying until it finds a valid code
          console.debug('Scanning...', errorMessage);
        }
      );

      setIsScanning(false);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera scanner');
      setIsScanning(false);
      onScanError?.(err.message || 'Failed to start camera scanner');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Scan QR Code or Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at the QR code or barcode on the sample container
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          )}

          {cameraPermission === 'denied' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <p className="font-medium mb-1">Camera permission denied</p>
              <p className="text-xs">
                Please enable camera access in your browser settings and try again.
              </p>
            </div>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            <div id={scannerId} className="w-full" style={{ minHeight: '300px' }} />
            
            {/* Scanning overlay */}
            {!isScanning && !error && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black opacity-30" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-64 border-2 border-white rounded-lg" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {error && (
              <Button
                type="button"
                onClick={startScanning}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            Make sure the code is well-lit and clearly visible in the frame
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

