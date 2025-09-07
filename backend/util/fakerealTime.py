import time
import ast

with open("saved_data.txt", "r", encoding="utf-8") as f:
        lines = f.readlines()
        data = [ast.literal_eval(line.strip()) for line in lines]

with open("fake_saved_data.txt", "w", encoding="utf-8") as f:
        for entry in data:
            f.write(str(entry) + "\n")
            f.flush()
            time.sleep(0.05)

        