// ---------------------------------------------------------------------------
// AUTOR + APOYO — EDITÁ ACÁ tus datos.
//
// Todo lo que dejes como "" (string vacío) NO se muestra. Así activás o
// desactivás cada link/método con solo completar o borrar su valor.
// ---------------------------------------------------------------------------

export const AUTHOR = {
  name: "Nelson Cabrera",
  // Bio corta (editá a gusto).
  tagline:
    "Argentino en Finlandia, hincha del fútbol y del código. Armé este fixture del Mundial 2026 en mis ratos libres, para tener un fixture limpio, organizado y de la manera que a mí me gustaría verlo. Si te sirvió y querés hacer una donación al proyecto, ¡te lo agradecería muchísimo!",
};

// Redes / contacto. Dejá "" lo que no quieras mostrar.
export const LINKS = {
  linkedin: "https://www.linkedin.com/in/nelsoncabrera06/",
  github: "https://github.com/nelsoncabrera06",
  // X/Twitter y PayPal quedan afuera a pedido de Nelson.
};

// Métodos de donación. Dejá "" los que no uses.
export const DONATIONS = {
  cafecito: "https://cafecito.app/nelsoncabrera",
  kofi: "https://ko-fi.com/nelsoncabrera",
  bitcoin: "", // por ahora sin BTC (sumar dirección on-chain o Lightning Address más adelante)
  usdt: "0xD902105Efa2fFd46194FDC62Ae8B59D3C6a54ba7", // dirección Metamask (la MISMA sirve para BSC y Polygon)
};

// Formulario de contacto vía Web3Forms (https://web3forms.com).
// PENDIENTE: pegá tu "Access Key" acá. Se obtiene gratis cargando tu email en
// web3forms.com (te llega la key por mail). La key es PÚBLICA y segura de
// commitear: solo sirve para que los mensajes te lleguen a ese email.
// Mientras esté en "", el formulario no se muestra.
export const CONTACT = {
  web3formsKey: "6ff791e9-f323-4386-be68-2d6cf07ea13b",
};
