const chalk = require('chalk');
const execa = require('execa');

const step = msg => console.log(chalk.bgYellowBright(chalk.black(msg)));
const success = msg => console.log(chalk.bgGreenBright(chalk.black(msg)));
const notice = msg => console.log(chalk.bgYellow(chalk.black(msg)));
const error = msg => console.log(chalk.bgRedBright(chalk.black(msg)));

const run = (bin, args = [], opts = { stdio: `inherit` }) =>
  execa(bin, args, opts);

const getGitBranch = () =>
  execa.commandSync(`git rev-parse --abbrev-ref HEAD`).stdout;

async function main() {
  if ([`master`, `dev`].includes(currentBranch)) {
    error(`\n当前处在 ${currentBranch} 分支，请切换到功能分支`);
    return;
  }
  const { stdout } = await run(`git`, [`diff`], { stdio: `pipe` });
  if (stdout) {
    step(`\n添加 git 追踪`);
    await run(`git`, [`add`, `-A`]);
    await run(`git-cz`);
  } else notice(`\n没有更新的文件`);

  await run(`git`, [`push`], { stdio: `pipe` });
  step(`\n切换到 dev 分支并拉取最新代码`);
  await run(`git`, [`checkout`, `dev`]);
  await run(`git`, [`pull`, `origin`, `dev`]);

  // 合并提交分支
  step(`\n合并到 dev`);
  await run(`git`, [`merge`, currentBranch]);
  success(`\n合并到 dev 分支完成`);
  step(`\n推送到远端`);
  await run(`git`, [`push`], { stdio: `pipe` });
  success(`\n推送 dev 完成，稍后 Jenkins 将启动构建并通知`);
  return;
}

const currentBranch = getGitBranch();

main()
  .catch(err => error(err))
  .finally(async () => {
    step(`\n切换回到 ${currentBranch} 分支`);
    await run(`git`, [`checkout`, currentBranch]);
    return;
  });
