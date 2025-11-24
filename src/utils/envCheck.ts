/**
 * Utility to check if environment variables are loaded correctly
 * This helps debug .env file loading issues
 */

export function checkEnvVars() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  console.group('🔍 Environment Variables Debug');
  console.log('VITE_GOOGLE_CLIENT_ID:', clientId || 'NOT SET');
  console.log('Type:', typeof clientId);
  console.log('Length:', clientId?.length || 0);
  console.log('Is placeholder?', clientId === 'your_google_client_id_here');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Dev mode?', import.meta.env.DEV);
  console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  console.groupEnd();
  
  return {
    clientId,
    isSet: !!clientId && clientId !== 'your_google_client_id_here',
    mode: import.meta.env.MODE,
  };
}

