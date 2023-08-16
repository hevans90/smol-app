import React, { useState } from 'react';

interface ItemProps {
  image: string;
  name: string;
  description: string;
  tradeString: string;
}

const ItemComponent: React.FC<ItemProps> = (props) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleMouseOver = () => {
    setShowDetails(true);
  };

  const handleMouseOut = () => {
    setShowDetails(false);
  };

  return (
    <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      <img src={props.image} alt={props.name} />
      {showDetails && (
        <div className="item-details">
          <h4>{props.name}</h4>
          <p>{props.description}</p>
          <button onClick={() => navigator.clipboard.writeText(props.tradeString)}>
            Copy Trade String
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemComponent;
