FROM	kalilinux/kali-linux-docker

ENV		DEBIAN_FRONTEND noninteractive

RUN		echo "deb http://http.kali.org/kali kali-rolling main contrib non-free" > /etc/apt/sources.list && \
		echo "deb-src http://http.kali.org/kali kali-rolling main contrib non-free" >> /etc/apt/sources.list

RUN		apt-get -y update && apt-get -y dist-upgrade && apt-get clean

RUN		apt-get install -y curl apt-utils nmap python ruby ruby-dev postgresql 
RUN		curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && \
		chmod 755 msfinstall && \
		./msfinstall

RUN		service postgresql start && msfconsole

EXPOSE	5432
EXPOSE	55553

ENV		username msfUser
ENV		password 123456

CMD		msfrpcd -U msfUser -P $password -n -f -a 0.0.0.0