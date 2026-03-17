import { Howl, Howler } from 'howler';

const defaultBeepUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const warningBeepUrl = 'https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3';

Howler.volume(1.0);

const sounds = {
  left: new Howl({
    src: [defaultBeepUrl],
  }),
  right: new Howl({
    src: [defaultBeepUrl],
  }),
  center: new Howl({
    src: [warningBeepUrl],
  })
};

sounds.left.pos(-2, 0, 0); // pan left
sounds.right.pos(2, 0, 0); // pan right
sounds.center.pos(0, 0, 0); // pan center

export const playSpatialSound = (location, distance = 1.0) => {
  // Distance based volume control: Near = Louder (Max 1.0), Far = Softer (Min 0.1)
  // Distance is in meters. We normalize it.
  const volume = Math.max(0.1, Math.min(1.0, 1 / (distance + 0.1)));
  Howler.volume(volume);

  if (location === 'left') {
    sounds.left.play();
  } else if (location === 'right') {
    sounds.right.play();
  } else {
    sounds.center.play();
  }
};

const SpatialAudioEngine = () => {
  return null;
};

export default SpatialAudioEngine;
