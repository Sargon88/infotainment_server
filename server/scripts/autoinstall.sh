#!/bin/bash
echo "-- Start OS clean --"
echo "-> sudo apt-get remove --purge -y wolfram-engine"
sudo apt-get remove --purge -y wolfram-engine
echo ""
echo "-> sudo apt-get remove --purge -y liberoffice*"
sudo apt-get remove --purge -y liberoffice*
echo ""
echo "-> sudo apt-get remove --purge -y bluej"
sudo apt-get remove --purge -y bluej
echo ""
echo "-> sudo apt-get remove --purge -y geany*"
sudo apt-get remove --purge -y geany*
echo ""
echo "-> sudo apt-get remove --purge -y greenfoot"
sudo apt-get remove --purge -y greenfoot
echo ""
echo "-> sudo apt-get remove --purge -y scratch scratch2"
sudo apt-get remove --purge -y scratch scratch2
echo ""
echo "-> sudo apt-get remove --purge -y sense-emu-tools"
sudo apt-get remove --purge -y sense-emu-tools
echo ""
echo "-> sudo apt-get remove --purge -y sonic-pi"
sudo apt-get remove --purge -y sonic-pi
echo ""
echo "-> sudo apt-get remove --purge -y python3-thonny"
sudo apt-get remove --purge -y python3-thonny
echo ""
echo "-> sudo apt-get remove --purge -y claws-mail"
sudo apt-get remove --purge -y claws-mail
echo ""
echo "-> sudo apt-get remove --purge -y minecraft-pi"
sudo apt-get remove --purge -y minecraft-pi
echo ""
echo "-> sudo apt-get remove --purge -y dillo"
sudo apt-get remove --purge -y dillo
echo ""
echo "-> sudo apt-get remove --purge -y squeak-vm"
sudo apt-get remove --purge -y squeak-vm
echo ""
echo "-> sudo apt-get remove --purge -y squeak-plugins-scratch"
sudo apt-get remove --purge -y squeak-plugins-scratch
echo ""
echo "-> sudo apt-get clean"
sudo apt-get clean
echo ""
echo "-> sudo apt-get -y autoremove"
sudo apt-get -y autoremove
echo ""
echo "-- Start Infotainment Install --"
