build:
	sudo docker build -t notice-pdf-generation-system .

run:
	sudo docker run -itd --restart always --name notice-pdf-generation-system -p 3000:3000 notice-pdf-generation-system

rebuild:
	sudo docker build -t notice-pdf-generation-system .
	sudo docker rm -f notice-pdf-generation-system
	sudo docker run -itd --restart always --name notice-pdf-generation-system -p 3000:3000 notice-pdf-generation-system
