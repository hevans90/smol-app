import {
  ChangeEvent, FC, useState } from 'react';
import { GearSectionComponent, GearItem } from './GearSectionComponent';

export const PoBInputComponent: FC = () => {
  const [pobString, setPobString] = useState<string>('');
  const [gear, setGear] = useState<GearItem>();

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPobString(e.target.value);
  };

  const handleParseClick = () => {
    const parsedGear = parsePoBString(pobString);
    setGear(parsedGear);
  };

  const parsePoBString = (str: string): GearItem => {
    try {
      const parsedObj = JSON.parse(str);
      return parsedObj.gear;
    } catch (error) {
      console.error("Error parsing PoB string:", error);
      throw error
    }
  };

  return (
    <div className="pob-input-component">
      <textarea
        value={pobString}
        onChange={handleInputChange}
        placeholder="Paste your Path of Building string here..."
        rows={5}
      />
      <button onClick={handleParseClick}>Parse PoB String</button>
      {gear && <GearSectionComponent gear={gear} />}
    </div>
  );
};
