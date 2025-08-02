// context/CouponContext.js
import React, { createContext, useState, useContext } from 'react';

const CouponContext = createContext();

export const CouponProvider = ({ children }) => {
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    return (
        <CouponContext.Provider value={{ appliedCoupon, setAppliedCoupon }}>
            {children}
        </CouponContext.Provider>
    );
};

export const useCoupon = () => useContext(CouponContext);
