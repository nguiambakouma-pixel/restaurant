import React, { createContext, useContext, useState } from 'react';

interface UserInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  deliveryMode: 'delivery' | 'pickup';
}

interface UserContextType {
  userInfo: UserInfo;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  hasUserInfo: () => boolean;
}

const defaultUserInfo: UserInfo = {
  name: '',
  phone: '',
  address: '',
  city: '',
  deliveryMode: 'delivery'
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUserInfo);

  const updateUserInfo = (info: Partial<UserInfo>) => {
    setUserInfo(prev => ({ ...prev, ...info }));
  };

  const hasUserInfo = () => {
    return !!(userInfo.name && userInfo.phone && 
      (userInfo.deliveryMode === 'pickup' || (userInfo.address && userInfo.city)));
  };

  return (
    <UserContext.Provider value={{
      userInfo,
      updateUserInfo,
      hasUserInfo
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;