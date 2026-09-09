import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  // Was previously triggered from the overlay View's onLayout prop, which
  // called setAnimate() from inside an async .finally() — React flagged
  // this as a state update racing ahead of the component's own commit
  // ("hasn't mounted yet"). useLayoutEffect is the same "wait until laid
  // out, before paint" timing onLayout gave us, but is where React expects
  // this kind of side effect to live.
  useLayoutEffect(() => {
    if (!visible || animate) return;
    SplashScreen.hideAsync().finally(() => {
      setAnimate(true);
    });
  }, [visible, animate]);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
  });

  const image = (
    <Image
      style={styles.splashLogo}
      source={require('../../assets/logo.png')}
      contentFit="contain"
    />
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    <View style={styles.splashOverlay}>
      {image}
    </View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image
        style={styles.image}
        source={require('../../assets/icon.png')}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 120,
    height: 120,
  },
  splashLogo: {
    width: 220,
    height: 220,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#041C17',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
