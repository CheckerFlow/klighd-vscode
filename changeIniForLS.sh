#!/bin/bash

# Adds the following to the kieler.ini of the language server to run without UI
# -application
# de.cau.cs.kieler.language.server.LanguageServer
#--noSplash
if [[ "$OSTYPE" == "linux-gnu" ]]; then
    # Linux
    sed -i '1s/^/-application\nde.cau.cs.kieler.language.server.LanguageServer\n-noSplash\n/' ./language-server/kieler.ini
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OSX
    sed -i '' "1i\\
    -application
    de.cau.cs.kieler.language.server.LanguageServer
    -noSplash
    " ./language-server/Contents/Eclipse/kieler.ini
elif [[ "$OSTYPE" == "cygwin" ]]; then
    sed -i '1s/^/-application\r\nde.cau.cs.kieler.language.server.LanguageServer\r\n-noSplash\r\n/' "language-server\kieler.ini"
        # POSIX compatibility layer and Linux environment emulation for Windows
elif [[ "$OSTYPE" == "msys" ]]; then
    echo not supported
        # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
elif [[ "$OSTYPE" == "win32" ]]; then
    echo not supported
        # I'm not sure this can happen.
elif [[ "$OSTYPE" == "freebsd"* ]]; then
    echo not supported
        # ...
else
    echo not supported
        # Unknown.
fi
