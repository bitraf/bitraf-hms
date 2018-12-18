# Bitraf HMS

Supporting repository for Bitraf's HSM work (see more at the wiki:
https://bitraf.no/wiki/HMS).

The ``hms-sheet`` is a small application to take the information from Bitraf's
wiki and turn it into a small A5 sized page that can be printed, laminated and
hung up next to the machine.

## HMS sheet

The application used Angular 7 so ``ng`` needs to be installed.

Installing all dependencies:

  npm install

Running the application in dev mode:

  ng server --open

This will automatically open a browser window for you. The server will run on
http://localhost:4100.

### Building for distribution

Do this:

  cd hms-sheet
  rm -rf prod
  ng build --prod --output-path prod --base-href=http://heim.bitraf.no/~trygvis/hms-sheet
  rsync -a --progress --delete prod/ heim.bitraf.no:www/hms-sheet

