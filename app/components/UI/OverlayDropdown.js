import React from 'react';

const OverlayDropdown = ({ items, selectedItems, toggleSelection, applyFilters, clearSelection }) => {
  return (
    <div className="overlay-dropdown">
      <div className="inner-z">
        <ul className="optionsUl">
          {items.map(item => (
            <li
              className={`optionsLi ${selectedItems.includes(item) ? 'active' : ''}`}
              key={item}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => toggleSelection(item)}
                />
              {item}
            </li>
          ))}
        </ul>
        <div className="ctas-q">
          <button className='apply-it' onClick={applyFilters}>Apply Filter(s)</button>
          <button className='clear-it' onClick={clearSelection}>Clear All</button>
        </div>
      </div>
    </div>
  );
};

export default OverlayDropdown;
