import { RadioGroup } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// Generic type for slider values
type DiscreteSliderProps = {
  values: string[];
  images?: string[];
  colors: string[];
  initialValue?: string; // Allow initial value to be passed in
  onChange?: (value: string) => void; // Callback for value change
};

export const DiscreteSlider = ({
  values,
  images,
  colors,
  initialValue,
  onChange,
}: DiscreteSliderProps) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    initialValue ?? values[0],
  );
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const selectedIndex = values.findIndex((val) => val === selectedValue);

  const updateSliderPosition = (clientX: number) => {
    if (!dragging || !trackRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const clickX = clientX - trackRect.left;
    const trackWidth = trackRect.width;

    // Normalize position within the track range [0, 1]
    const clickPosition = Math.min(Math.max(0, clickX), trackWidth);
    const closestValueIndex = Math.round(
      (clickPosition / trackWidth) * (values.length - 1),
    );
    const closestValue = values[closestValueIndex];

    setSelectedValue(closestValue);
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    e.preventDefault(); // prevents edge overscoll on touch devices

    const clientX = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0].clientX
      : (e as MouseEvent).clientX;

    updateSliderPosition(clientX);
  };

  useEffect(() => {
    if (dragging) {
      document.body.style.cursor = 'grabbing';

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('touchmove', handlePointerMove, {
        passive: false,
      });
      window.addEventListener('mouseup', () => {
        setDragging(false);
        document.body.style.cursor = 'default';
      });
      window.addEventListener('touchend', () => setDragging(false));
    } else {
      onChange?.(selectedValue);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', () => setDragging(false));
      window.removeEventListener('touchend', () => setDragging(false));
      document.body.style.cursor = 'default';
    };
  }, [dragging, selectedValue, onChange]);

  // Handle clicks or taps on the track to update the selected value
  const handleTrackClick = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const clientX =
        e.type === 'touchstart'
          ? (e as React.TouchEvent).touches[0].clientX
          : (e as React.MouseEvent).clientX;

      const clickX = clientX - trackRect.left;
      const trackWidth = trackRect.width;

      const clickPosition = Math.min(Math.max(0, clickX), trackWidth);
      const closestValueIndex = Math.round(
        (clickPosition / trackWidth) * (values.length - 1),
      );
      const closestValue = values[closestValueIndex];

      setSelectedValue(closestValue);
    }
  };

  const handleThumbPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  return (
    <div className="w-full select-none px-4 py-8">
      <RadioGroup
        value={selectedValue}
        onChange={(value: string) => {
          setSelectedValue(value);
          onChange?.(value);
        }}
        className="relative"
      >
        <RadioGroup.Label className="sr-only">Select a value</RadioGroup.Label>

        {/* Slider Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onTouchStart={handleTrackClick} // Handle touch start on track
          className={twMerge(
            'relative h-4 rounded bg-primary-900 bg-opacity-30',
            dragging ? '' : 'cursor-pointer',
          )}
        >
          {/* Active Segment: dynamically set to align with selected option */}
          <div
            className={twMerge(
              'absolute h-full rounded-l transition-all',
              colors[values.indexOf(selectedValue)],
            )}
            style={{
              width: `${(values.indexOf(selectedValue) / (values.length - 1)) * 100}%`,
            }}
          ></div>

          {/* Slider Options (Indicators) */}
          <div className="absolute bottom-0 flex w-full justify-between px-4">
            {values.map((value, index) => (
              <RadioGroup.Option key={value} value={value} className="relative">
                {({ checked }: { checked: boolean }) => (
                  <span
                    className={twMerge(
                      'opacity-40',
                      selectedIndex === index && 'opacity-100',
                    )}
                  >
                    {/* Text Label - Centered Under Each Value */}
                    <span
                      className={twMerge(
                        'absolute left-1/2 top-4 -translate-x-1/2 transform text-center',
                        checked ? 'text-primary-300' : 'text-primary-800',
                      )}
                    >
                      {value}
                    </span>
                  </span>
                )}
              </RadioGroup.Option>
            ))}
          </div>

          {/* Draggable Thumb (Circular Notch) - the image of the selected value */}
          <div
            ref={thumbRef}
            className={twMerge(
              'absolute -top-4 z-10 h-12 w-12 transition-transform',
              dragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
            style={{
              left: `calc(${(values.indexOf(selectedValue) / (values.length - 1)) * 100}% - 1.5rem)`,
            }}
            onMouseDown={handleThumbPointerDown}
            onTouchStart={handleThumbPointerDown}
          >
            <img
              className="h-full w-full rounded-full border-[3px] border-primary-800 object-contain"
              src={images?.[selectedIndex]}
              alt={selectedValue}
            />
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
