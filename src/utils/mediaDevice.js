import {mediaDevices} from 'react-native-webrtc';

class MediaDevice {
  stream = null;
  videoSourceId = 0;
  setStream = null;
  isFront = true;

  constructor(isFront, minHeight, minWidth, minFrameRate) {
    this.minHeight = minHeight;
    this.minWidth = minWidth;
    this.minFrameRate = minFrameRate;
    this.isFront = isFront;

    mediaDevices.enumerateDevices().then(sourceInfo => {
      for (let i = 0; i < sourceInfo.length; i++) {
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === (this.isFront ? 'front' : 'environment')
        ) {
          this.videoSourceId = sourceInfo.deviceId;
        }
      }
    });
  }

  switchCamera = () => {
    this.stream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  async getStream() {
    return await mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          mandatory: {
            width: {ideal: this.minWidth},
            height: {ideal: this.minHeight},
            frameRate: this.minFrameRate,
          },
          facingMode: this.isFront ? 'user' : 'environment',
          optional: this.videoSourceId ? [{sourceId: this.videoSourceId}] : [],
        },
      })
      .then(stream => {
        return (this.stream = stream);
      });
  }
}

export default MediaDevice;
