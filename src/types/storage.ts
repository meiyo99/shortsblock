export interface UserPreferences {
  redirectHomepage: boolean;
  blockShorts: boolean;
  focusedWatch: boolean;
  redactComments: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  redirectHomepage: true,
  blockShorts: true,
  focusedWatch: true,
  redactComments: true,
};
