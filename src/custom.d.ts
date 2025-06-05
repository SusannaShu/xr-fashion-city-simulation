// Declaration for CSS modules (.module.css)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Declaration for SCSS modules (.module.scss) - if you use them
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Declaration for regular CSS files (if you import them directly and need type safety, less common)
declare module '*.css' {
  const content: string;
  export default content;
}
