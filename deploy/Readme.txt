# Apply playbook
# ansible-playbook -i ./deploy/infra/hosts ./deploy/server.yml

# Ping
# ansible server -i "./deploy/infra/hosts" -u freebsd -m ping -vvvv

# Add repository Ansible
sudo ./add-apt-repository.sh ppa:ansible/ansible