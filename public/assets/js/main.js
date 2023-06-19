import { log } from "./clientutils.js";

if ( window ) {

  addEventListener( "beforeunload", ( event ) => {
    log( `\n\tBefore unload\n` );
  } );
}
