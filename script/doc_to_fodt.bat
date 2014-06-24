set path=%path%;D:\Program Files (x86)\LibreOffice 4\program
for %%f in ("D:\work\book_rep\src\Romanian\*.rtf") do (
soffice --headless -convert-to fodt:"OpenDocument Text Flat XML" %%f --outdir "D:\work\book_rep\fodt\Romanian\"
)
