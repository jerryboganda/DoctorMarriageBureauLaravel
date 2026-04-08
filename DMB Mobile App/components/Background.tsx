import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Rect, LinearGradient, vec, Circle, BlurMask } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export const Background = () => {
  // Orb 1 Animation (Top Leftish)
  const orb1X = useSharedValue(width * 0.2);
  const orb1Y = useSharedValue(height * 0.2);

  // Orb 2 Animation (Bottom Rightish)
  const orb2X = useSharedValue(width * 0.8);
  const orb2Y = useSharedValue(height * 0.6);

  useEffect(() => {
    orb1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.7, { duration: 15000, easing: Easing.inOut(Easing.quad) }), 
        withTiming(width * 0.2, { duration: 15000, easing: Easing.inOut(Easing.quad) })
      ), 
      -1, 
      true
    );
    
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.3, { duration: 12000, easing: Easing.inOut(Easing.quad) }), 
        withTiming(height * 0.2, { duration: 12000, easing: Easing.inOut(Easing.quad) })
      ), 
      -1, 
      true
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(width * 0.3, { duration: 18000, easing: Easing.inOut(Easing.quad) }), 
        withTiming(width * 0.8, { duration: 18000, easing: Easing.inOut(Easing.quad) })
      ), 
      -1, 
      true
    );
    
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.5, { duration: 14000, easing: Easing.inOut(Easing.quad) }), 
        withTiming(height * 0.6, { duration: 14000, easing: Easing.inOut(Easing.quad) })
      ), 
      -1, 
      true
    );
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       <Canvas style={{ flex: 1 }}>
          <Rect x={0} y={0} width={width} height={height}>
             <LinearGradient
               start={vec(0, 0)}
               end={vec(width, height)}
               colors={['#F8FAFC', '#EFF6FF', '#F1F5F9', '#FFFFFF']} 
             />
          </Rect>
          
          {/* Primary Orb - Indigo/Blue Soft */}
          <Circle cx={orb1X} cy={orb1Y} r={180} color="#E0E7FF" opacity={0.6}>
             <BlurMask blur={100} style="normal" />
          </Circle>

          {/* Secondary Orb - Very Subtle Slate */}
          <Circle cx={orb2X} cy={orb2Y} r={160} color="#F1F5F9" opacity={0.5}>
             <BlurMask blur={90} style="normal" />
          </Circle>

          {/* Fixed Accents */}
          <Circle cx={width * 0.9} cy={height * 0.1} r={80} color="#DBEAFE" opacity={0.4}>
             <BlurMask blur={60} style="normal" />
          </Circle>

       </Canvas>
    </View>
  );
};

export default Background;
