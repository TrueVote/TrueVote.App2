import { UserModel } from '@/TrueVote.Api';
import React, { Context, ReactNode, createContext, useContext, useState } from 'react';
import { Localization } from './services/Localization';
import { NostrProfile, emptyNostrProfile } from './services/NostrHelper';

export const emptyUserModel: UserModel = {
  UserId: '',
  NostrPubKey: '',
  FirstName: '',
  Email: '',
  DateCreated: '',
};

interface GlobalContextType {
  nostrProfile: NostrProfile | undefined;
  userModel: UserModel | undefined;
  localization: Localization | undefined;
  accessToken: string | undefined;
  updateNostrProfile: (np: NostrProfile) => void;
  updateUserModel: (ui: UserModel) => void;
  updateLocalization: (loc: Localization) => void;
  updateAccessToken: (token: string) => void;
}

const GlobalContext: Context<GlobalContextType | undefined> = createContext<
  GlobalContextType | undefined
>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({
  children,
}: GlobalProviderProps) => {
  const [nostrProfile, setNostrProfile] = useState<NostrProfile>(emptyNostrProfile);
  const [userModel, setUserModel] = useState<UserModel>(emptyUserModel);
  const [localization, setLocalization] = useState<Localization>();
  const [accessToken, setAccessToken] = useState<string>('');

  const updateNostrProfile: (np: NostrProfile) => void = (np: NostrProfile) => {
    setNostrProfile(np);
  };

  const updateUserModel: (um: UserModel) => void = (um: UserModel) => {
    setUserModel(um);
  };

  const updateLocalization: (loc: Localization) => void = (loc: Localization) => {
    setLocalization(loc);
  };

  const updateAccessToken: (token: string) => void = (token: string) => {
    setAccessToken(token);
  };

  return (
    <GlobalContext.Provider
      value={{
        nostrProfile,
        updateNostrProfile,
        userModel,
        updateUserModel,
        localization,
        updateLocalization,
        accessToken,
        updateAccessToken,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext: () => GlobalContextType = () => {
  const context: GlobalContextType | undefined = useContext(GlobalContext);
  if (context === undefined) {
    console.error('useGlobalContext must be used within a GlobalProvider');
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }

  return context;
};
