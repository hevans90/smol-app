import { RadioGroup } from '@headlessui/react';
import { useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// Generic type for slider values
type DiscreteSliderProps = {
  values: string[];
  images?: string[];
  colors: string[];
  initialValue?: string; // Allow initial value to be passed in
  onChange?: (value: string) => void; // Callback for value change
};

export const DiscreteSlider = <T,>({
  values,
  images,
  colors,
  initialValue,
  onChange,
}: DiscreteSliderProps) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    initialValue ?? values[0],
  );

  const selectedIndex = values.findIndex((val) => val === selectedValue);

  console.log({ selectedIndex });

  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - trackRect.left;
      const trackWidth = trackRect.width;

      const clickPosition = clickX / trackWidth;

      const closestValueIndex = Math.round(clickPosition * (values.length - 1));
      setSelectedValue(values[closestValueIndex]);
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <RadioGroup
        value={selectedValue}
        onChange={(value: string) => {
          setSelectedValue(value);
          onChange?.(value); // Call onChange callback if provided
        }}
        className="relative"
      >
        <RadioGroup.Label className="sr-only">Select a value</RadioGroup.Label>

        {/* Slider Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-4 cursor-pointer rounded bg-primary-900 bg-opacity-30"
        >
          <div
            className={twMerge(
              'absolute -inset-1 rounded bg-gradient-to-r from-gray-900 to-primary-300 opacity-0 blur',
              selectedIndex === values.length - 1 && '-inset-2 opacity-90',
              selectedIndex === values.length - 2 && 'opacity-60',
              selectedIndex === values.length - 3 && 'opacity-40',
            )}
            style={{
              width: `${(values.indexOf(selectedValue) / (values.length - 1)) * 100 + (selectedIndex === values.length - 1 ? 2 : 1)}%`,
            }}
          ></div>

          {/* Active Segment: dynamically set to align with selected option */}
          <div
            className={twMerge(
              'absolute h-full rounded-l transition-all',
              selectedIndex === values.length - 1 && 'rounded-r',
              colors[values.indexOf(selectedValue)],
            )}
            style={{
              width: `${(values.indexOf(selectedValue) / (values.length - 1)) * 100}%`,
            }}
          ></div>

          {/* Slider Options (Indicators) */}
          <div className="absolute -top-8 -ml-[1%]  flex w-[102%] justify-between">
            {values.map((value, index) => (
              <RadioGroup.Option key={value} value={value} className="relative">
                {({ checked }: { checked: boolean }) => (
                  <span
                    className={twMerge(
                      'flex flex-col items-center opacity-40',
                      checked ? 'cursor-auto' : 'cursor-pointer',
                      selectedIndex === index && 'opacity-100',
                    )}
                  >
                    {/* Dot */}
                    <img
                      className={twMerge(
                        'h-8 w-8',
                        selectedIndex === index && 'h-12 w-12',
                      )}
                      src={images?.[index]}
                    />

                    {/* Value Label */}
                    <span
                      className={twMerge(
                        'absolute top-14 whitespace-nowrap text-center',
                        checked ? 'text-primary-300' : 'text-primary-800',
                      )}
                    >
                      {value}
                    </span>
                    <span className="absolute -top-6 h-20 w-20 " />
                  </span>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
