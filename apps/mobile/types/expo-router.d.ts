declare module 'expo-router' {
  export * from 'expo-router/build';
}
declare module 'expo-router/build' {
  export const router: {
    push: (url: string | { pathname: string; params?: Record<string, any> }) => void;
    replace: (url: string | { pathname: string; params?: Record<string, any> }) => void;
    back: () => void;
    navigate: (url: string | { pathname: string; params?: Record<string, any> }) => void;
  };
  export function useRouter(): typeof router;
  export function useLocalSearchParams<T = Record<string, string>>(): T;
  export function useGlobalSearchParams<T = Record<string, string>>(): T;
  export function Link(props: any): any;
  export function Redirect(props: any): any;
  export function useSegments(): string[];
  export function useNavigation(): any;
  export const Stack: React.ComponentType<any> & { Screen: React.ComponentType<any> };
  export const Tabs: React.ComponentType<any> & { Screen: React.ComponentType<any> };
}
