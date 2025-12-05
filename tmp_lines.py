import pathlib
path = pathlib.Path(r"src/app/page.tsx")
for i,line in enumerate(path.read_text().splitlines(),1):
    if 'panelTopTitle' in line or 'OwnerPanel' in line and 'initialHeroCopy' in line:
        print(f"{i}: {line.rstrip()}")
