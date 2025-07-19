export const log = (label, data) => {
  if (import.meta.env.MODE === 'development') {
    console.groupCollapsed(`%c[Oráculo] ${label}`, 'color: #5e17eb; font-weight: bold;');
    console.log(data);
    console.groupEnd();
  }
};

export const logError = (label, error) => {
  if (import.meta.env.MODE === 'development') {
    console.groupCollapsed(`%c[Oráculo - ERRO] ${label}`, 'color: red; font-weight: bold;');
    console.error(error);
    console.groupEnd();
  }
};
