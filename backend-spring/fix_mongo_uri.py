import os
import urllib.parse
import re

env_file = 'C:/Users/hp/ecommerce-platform/backend-spring/.env'
with open(env_file, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('MONGO_URI='):
        uri = line.strip()[len('MONGO_URI='):]
        prefix_match = re.match(r'^(mongodb(?:\+srv)?://)(.*)$', uri)
        if prefix_match:
            prefix = prefix_match.group(1)
            rest = prefix_match.group(2)
            
            parts = rest.rsplit('@', 1)
            if len(parts) == 2:
                userpass = parts[0]
                host_rest = parts[1]
                
                up_parts = userpass.split(':', 1)
                if len(up_parts) == 2:
                    username = urllib.parse.quote_plus(urllib.parse.unquote_plus(up_parts[0]))
                    password = urllib.parse.quote_plus(urllib.parse.unquote_plus(up_parts[1]))
                    new_uri = f"{prefix}{username}:{password}@{host_rest}"
                    new_lines.append(f"MONGO_URI={new_uri}\n")
                    continue
        new_lines.append(line)
    else:
        new_lines.append(line)

with open(env_file, 'w') as f:
    f.writelines(new_lines)

print("Fixed MONGO_URI with special characters")
