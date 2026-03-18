//@ts-nocheck
import React from 'react';
import { render } from '@testing-library/react-native';
import { Circle } from 'react-native-svg';
import RadialSlider from '../RadialSlider';

jest.useFakeTimers();

describe('RadialSlider component', () => {
  it('renders a pink gesture hit area around the thumb', () => {
    const { UNSAFE_getAllByType } = render(<RadialSlider />);
    const circles = UNSAFE_getAllByType(Circle);
    const gestureCircle = circles.find(
      circle => typeof circle.props.onResponderMove === 'function'
    );

    expect(gestureCircle).toBeTruthy();
    expect(gestureCircle.props.fill).toBe('pink');
    expect(gestureCircle.props.fillOpacity).toBe(0.35);
  });

  it('Match Snapshot', () => {
    const { toJSON } = render(<RadialSlider />);
    expect(toJSON()).toMatchSnapshot();
  });
});
