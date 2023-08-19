for file in $(find tex -name "*.tex"); do
  htlatex ${file} "utils/mycfg.cfg"
done

find . -type f ! -name "*.tex" ! -name "*.css" ! -name "*.html" ! -name "*.pdf" ! -name "mycfg.cfg" ! -name "build-html.sh" -delete

#for file in $(find )