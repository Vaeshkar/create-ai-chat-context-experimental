Make PNGS:

```bash
for file in *.mmd; do mmdc -i "$file" -o "${file%.mmd}.png" -w 1920 -H 1080 -s 3; done
```
